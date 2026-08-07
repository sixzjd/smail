<template>
  <div class="s-email-skeleton">
    <div v-for="item in rows" :key="item" :class="['skeleton-row', type]">
      <div class="sk-checkbox-wrap">
        <div class="sk-shimmer sk-checkbox-shim"></div>
      </div>
      <div class="sk-star-wrap" v-if="showStar">
        <div class="sk-shimmer sk-star-shim"></div>
      </div>
      <div v-if="!showStar" class="sk-star-wrap"></div>
      <div class="sk-content">
        <div class="sk-sender-row">
          <div class="sk-shimmer" style="width: 120px;"></div>
          <div class="sk-shimmer sk-time-shim" style="width: 50px;"></div>
        </div>
        <div class="sk-text-row">
          <div class="sk-shimmer" style="width: 65%;"></div>
          <div class="sk-shimmer sk-preview-shim" style="width: 30%;"></div>
        </div>
        <div class="sk-user-row" v-if="showUserInfo">
          <div class="sk-shimmer" style="width: 180px;"></div>
          <div class="sk-shimmer" style="width: 180px;"></div>
        </div>
      </div>
      <div class="sk-date-wrap">
        <div class="sk-shimmer" style="width: 60px;"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: {
    type: Number,
    default: 1
  },
  showStar: {
    type: Boolean,
    default: true
  },
  accountShow: {
    type: Boolean,
    default: false
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  showUserInfo: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: ''
  }
})
import {Icon} from "@iconify/vue";
</script>

<style scoped lang="scss">
.s-email-skeleton {
  background: var(--s-paper);
}

.skeleton-row {
  display: grid;
  grid-template-columns: 40px 36px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  min-height: 52px;
  border-bottom: 1px solid var(--s-line-light);

  &.all-email {
    min-height: 68px;
  }
}

.sk-checkbox-wrap {
  display: flex;
  justify-content: center;
  padding: 0 4px;
}

.sk-star-wrap {
  display: flex;
  justify-content: center;
  width: 36px;
}

.sk-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding-right: 12px;
}

.sk-sender-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sk-text-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sk-user-row {
  display: flex;
  gap: 10px;
  margin-top: 2px;
}

.sk-date-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
}

.sk-shimmer {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--s-soft) 25%, var(--s-line-light) 50%, var(--s-soft) 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease infinite;
}

.sk-checkbox-shim {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.sk-star-shim {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.sk-time-shim {
  flex-shrink: 0;
}

.sk-preview-shim {
  opacity: 0.6;
}

@keyframes sk-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@media (max-width: 1366px) {
  .skeleton-row {
    grid-template-columns: 40px 1fr auto;
    min-height: 80px;
    gap: 6px;
    padding: 10px 12px;

    &.all-email {
      min-height: 120px;
    }
  }

  .sk-star-wrap {
    display: none;
  }

  .sk-date-wrap {
    display: none;
  }

  .sk-time-shim {
    display: block;
  }
}

@media (min-width: 1367px) {
  .sk-time-shim {
    display: none;
  }
}
</style>
